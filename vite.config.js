import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { mkdir, writeFile } from 'node:fs/promises'

// "/" and "/index"/"/index.html" are the Home page (React) — the site index.
// The Platform page now lives at "/platform.html" only, served automatically
// by Vite's static public-dir handling (same as "/capability.html").
const reactRoutes = new Set(['/', '/index', '/index.html', '/solutions', '/sol', '/testsol', '/testsol1', '/testsol2', '/about', '/contact', '/privacy', '/terms', '/deep-tech', '/deep-tech-test', '/deep-tech-video-test', '/deep-technology', '/capabilities/deep-technology'])

function routeStaticAndReactPages() {
  return {
    name: 'route-static-and-react-pages',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname
        const routePath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname

        // PHP is executed by cPanel in production. Never let Vite serve its
        // source code through a local network or temporary public tunnel.
        if (routePath === '/api/contact.php') {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            success: false,
            message: 'Contact submissions are available on the production server.',
          }))
          return
        } else if (reactRoutes.has(routePath)) {
          req.url = `/react.html${req.url.slice(pathname.length)}`
        }

        next()
      })
    },
  }
}

function prepareCpanelBuild(deployBase) {
  const localTargets = [
    'platform.html',
    'capability.html',
    'solutions',
    'sol',
    'about',
    'contact',
    'privacy',
    'terms',
    'index-chrome.css',
    'page-transition.js',
    'site-crosshair.js',
  ]

  const prefixLocalUrls = (html) => {
    const prefixed = localTargets.reduce(
      (content, target) => content.replaceAll(`"/${target}`, `"${deployBase}/${target}`),
      html,
    )
    return prefixed
      .replaceAll('href="/"', `href="${deployBase}/"`)
      .replaceAll('"../solutions.html"', `"${deployBase}/solutions/"`)
      .replaceAll('"../about/about.html"', `"${deployBase}/about/"`)
      .replaceAll('"../contact.html"', `"${deployBase}/contact/"`)
  }

  return {
    name: 'prepare-cpanel-build',
    async closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist')
      const staticPages = ['platform.html', 'capability.html']

      for (const filename of staticPages) {
        const path = resolve(dist, filename)
        await writeFile(path, prefixLocalUrls(await readFile(path, 'utf8')))
      }

      const reactEntry = resolve(dist, 'react.html')
      const reactHtml = await readFile(reactEntry, 'utf8')

      // "/" and "/index.html" are the site index (Home) — write the React
      // shell directly to the dist root so both resolve on a static host.
      await writeFile(resolve(dist, 'index.html'), reactHtml)

      for (const route of ['index', 'solutions', 'sol', 'testsol', 'testsol1', 'testsol2', 'about', 'contact', 'privacy', 'terms', 'deep-tech', 'deep-tech-test', 'deep-tech-video-test', 'deep-technology', 'capabilities/deep-technology']) {
        const routeDirectory = resolve(dist, route)
        await mkdir(routeDirectory, { recursive: true })
        await writeFile(resolve(routeDirectory, 'index.html'), reactHtml)
      }

      await writeFile(
        resolve(dist, 'UPLOAD-INSTRUCTIONS.txt'),
        `Upload all contents of this dist folder into the cPanel directory for ${deployBase}/\n`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const deployBase = (process.env.CPANEL_BASE_PATH || '/in-en').replace(/\/$/, '')
  return {
  base: command === 'build' ? `${deployBase}/` : '/',
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  plugins: [routeStaticAndReactPages(), react(), command === 'build' && prepareCpanelBuild(deployBase)].filter(Boolean),
  build: {
    rollupOptions: {
      input: {
        react: resolve(import.meta.dirname, 'react.html'),
      },
    },
  },
  }
})
