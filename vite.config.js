import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { mkdir, writeFile } from 'node:fs/promises'

const reactRoutes = new Set(['/solutions', '/sol', '/testsol', '/testsol1', '/testsol2', '/about', '/contact', '/privacy', '/terms', '/deep-tech', '/deep-technology', '/capabilities/deep-technology'])

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
        } else if (routePath === '/' || routePath === '/index.html') {
          try {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(await readFile(resolve(import.meta.dirname, 'public/index.html')))
          } catch (error) {
            next(error)
          }
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
    'index.html',
    'capability.html',
    'capabilities',
    'solutions',
    'sol',
    'about',
    'contact',
    'privacy',
    'terms',
    'index-chrome.css',
    'page-transition.js',
    'site-crosshair.js',
    'nav-detection-lab.png',
    'deeptech-ion-chamber.png',
    'deeptech-matter-v2.png',
    'deeptech-pathway-v2.png',
    'deeptech-operation-v2.png',
    'nav-capabilities-science.png',
    'nav-solutions-detection.png',
    'nav-about-engineers.png',
    'deeptech-healthcare-breath.png',
    'deeptech-discipline-science.png',
    'deeptech-discipline-engineering.png',
    'deeptech-discipline-intelligence.png',
    'deeptech-discipline-industrial.png',
    'deeptech-problem-security.png',
    'deeptech-problem-health.png',
    'deeptech-problem-industry.png',
    'deeptech-problem-food-water.png',
    'deeptech-problem-infrastructure.png',
    'deeptech-problem-national-security.png',
    'deep-technology-active-capture.png',
  ]

  const prefixLocalUrls = (html) => {
    const prefixed = localTargets.reduce(
      (content, target) => content.replaceAll(`"/${target}`, `"${deployBase}/${target}`),
      html,
    )
    return prefixed
      .replaceAll('"../solutions.html"', `"${deployBase}/solutions/"`)
      .replaceAll('"../about/about.html"', `"${deployBase}/about/"`)
      .replaceAll('"../contact.html"', `"${deployBase}/contact/"`)
  }

  return {
    name: 'prepare-cpanel-build',
    async closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist')
      const staticPages = ['index.html', 'capability.html']

      for (const filename of staticPages) {
        const path = resolve(dist, filename)
        await writeFile(path, prefixLocalUrls(await readFile(path, 'utf8')))
      }

      const reactEntry = resolve(dist, 'react.html')
      const reactHtml = await readFile(reactEntry, 'utf8')
      for (const route of ['solutions', 'sol', 'testsol', 'testsol1', 'testsol2', 'about', 'contact', 'privacy', 'terms', 'deep-tech', 'deep-technology', 'capabilities/deep-technology']) {
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
