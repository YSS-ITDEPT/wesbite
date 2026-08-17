import LegalPage from './LegalPage.jsx'

const SECTIONS = [
  {
    heading: 'Information on this Website',
    body: [
      'This website provides general information about the products and services offered by Anika Sterilis. The content is intended for educational purposes only and does not substitute the relationship between you and a professional advisor. Anika Sterilis does not offer medical, legal, or any professional services or advice. Always consult with a professional in the respective field for advice related to diagnosis, treatment, or consultation.',
      'Information is subject to change, so it is essential to confirm details with a certified expert before making decisions based on the material on this website.',
      'Additionally, this site may include details on products and services approved for certain regions, including Canada. If you are outside of this region, be aware that some products or services may not be available or approved in your country.',
    ],
  },
  {
    heading: 'Copyright and Trademarks',
    body: [
      'All content available on this website is owned or licensed by Anika Sterilis and is protected under applicable copyright laws. You may download, email, or print materials from this website solely for personal, non-commercial use. All copyright notices and ownership information must remain intact in any distributed material.',
      'Anika Sterilis owns all trademarks associated with its products and services. You must not use any logos, marks, or branding found on this site without prior written consent from Anika Sterilis.',
      'Special terms may apply to the usage of certain content on specific sections of this website, which will be clearly stated.',
      'Unauthorized usage of website materials, trademarks, or content will result in the termination of your rights to access this website and may lead to legal action.',
    ],
  },
  {
    heading: 'Linking to this Site',
    body: [
      'We grant you a limited, revocable, non-exclusive right to create hyperlinks to our website. However, these links must not misrepresent our association or endorsement and cannot appear on any website that could be considered inappropriate, defamatory, offensive, or harmful. Anika Sterilis reserves the right to withdraw this permission at any time.',
      'Framing or duplicating content from this website to any other platform is strictly prohibited without our written authorization.',
    ],
  },
  {
    heading: 'External Links',
    body: [
      'This website may contain links to external websites not controlled or managed by Anika Sterilis. These links are provided for your convenience only. We do not endorse or take responsibility for the accuracy or content of external sites, nor for any interactions or business you conduct with these third-party platforms. Please review the respective terms of use and privacy policies of any website you visit through links on our website.',
    ],
  },
  {
    heading: 'Submitted Feedback and Ideas',
    body: [
      'While we welcome feedback and suggestions from our users, any information you share through this website will be considered non-confidential unless otherwise specified. By submitting content, ideas, or suggestions to us, you grant Anika Sterilis a royalty-free, perpetual license to use, distribute, and modify the material as we see fit without obligation.',
    ],
  },
  {
    heading: 'Disclaimer of Warranties',
    body: [
      'The materials and content on this website are provided "as is" without any guarantees or warranties of any kind. Anika Sterilis disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a specific purpose, and non-infringement. We make no representation about the accuracy or completeness of the content on the site.',
      'We also do not guarantee that your experience using this website will be uninterrupted, secure, or error-free. It is your responsibility to safeguard your systems against any potential risks, including viruses or malware.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    body: [
      'Under no circumstances shall Anika Sterilis, its employees, agents, or affiliates be held liable for any direct, indirect, incidental, or consequential damages arising out of your use or inability to use this website. This limitation covers claims based on warranty, contract, tort, or any other legal theory.',
      'The total liability of Anika Sterilis, if any, shall not exceed the actual amount paid by you to access the website or a maximum of U.S. $100.00.',
    ],
  },
  {
    heading: 'Additional Terms',
    body: [
      'In addition to these Terms of Use, specific sections of the website may contain additional terms and conditions. You agree to comply with these additional terms when accessing those areas.',
      'Your obligations under this agreement will continue even if you cease using the website or if this agreement is terminated.',
    ],
  },
  {
    heading: 'Governing Law and Jurisdiction',
    body: [
      "These Terms of Use are governed by the laws of Anika Sterilis's Jurisdiction, without reference to conflicts of laws principles. Any dispute related to the use of this website will be resolved in the courts located within Anika Sterilis's Jurisdiction, and by using this website, you consent to the jurisdiction of these courts.",
    ],
  },
  {
    heading: 'Contact Us',
    body: [
      'If you have any questions or need further clarification regarding these terms, please feel free to contact us using the information provided on our "Contact Us" page.',
    ],
  },
]

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal / Terms of Use"
      title="Terms of Use"
      subtitle="Please read these terms carefully before using the Anika Sterilis website."
      sections={SECTIONS}
    />
  )
}

export default TermsPage
