import LegalPage from './LegalPage.jsx'

const SECTIONS = [
  {
    heading: 'Information We Collect and Why',
    body: [
      'We collect personal data necessary to support our business functions, including the delivery of our advanced detection systems and services. This information may include your name, address, contact details, and professional or sensitive data like health information when required.',
      'We always seek your explicit consent prior to collecting any sensitive data and will inform you of the purposes for which it will be used.',
    ],
  },
  {
    heading: 'How We Use and Share Your Information',
    body: [
      'Your data is collected for specific purposes, such as providing our products, offering technical support, fulfilling legal obligations, or addressing customer inquiries. We only use your personal and sensitive information for these defined purposes and, when necessary, share it with third parties involved in our business operations.',
      'In cases where we share data, it will be done with your consent, and we ensure that our partners adhere to the same data protection standards.',
    ],
  },
  {
    heading: 'International Data Transfers',
    body: [
      'As part of a global organization, your data may be transferred to affiliated entities or secure databases located outside India. We take necessary steps to ensure that your data remains protected and handled according to the same high standards, regardless of location.',
    ],
  },
  {
    heading: 'Keeping Your Information Safe',
    body: [
      'We implement robust security measures to protect your personal and sensitive data from unauthorized access, misuse, or alteration. Your information is stored on secure servers with restricted access, and any physical records are safeguarded to prevent unauthorized use. We regularly review our security processes to ensure your data is safe.',
    ],
  },
  {
    heading: 'Your Rights and How to Contact Us',
    body: [
      'You have the right to access, correct, or request the removal of your personal data at any time. If you wish to update your information or have concerns about how we handle your data, you can reach out to our Privacy Officer. We aim to resolve all privacy-related inquiries promptly.',
    ],
  },
  {
    heading: 'Retention and Disposal of Data',
    body: [
      'We only retain your personal data for as long as necessary to fulfill the purpose for which it was collected, or as required by law. Once the data is no longer needed, we will securely destroy or anonymize it, ensuring it is no longer identifiable.',
    ],
  },
  {
    heading: 'Updates to This Privacy Notice',
    body: [
      'We may revise this Data Privacy Notice periodically to reflect changes in our practices or legal requirements. Any updates will be communicated promptly, and you may request the latest version from us at any time.',
    ],
  },
]

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal / Data Privacy"
      title="Our Commitment to Safeguarding Your Data"
      effectiveDate="26th September, 2024"
      intro={
        'At Anika Sterilis Private Limited (hereafter referred to as "we," "us," or "Anika Sterilis"), we take the privacy and security of your personal data seriously. This statement explains how we collect, use, and safeguard your information in compliance with Indian privacy laws, including the Information Technology Act, 2000, and its associated rules. We are dedicated to protecting your personal and sensitive data in line with applicable Indian laws, such as the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, the Indian Penal Code, and other relevant regulations. Our aim is to handle your sensitive personal data, such as financial details or health information, with the highest standards of care and confidentiality.'
      }
      sections={SECTIONS}
    />
  )
}

export default PrivacyPage
