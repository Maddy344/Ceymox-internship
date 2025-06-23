const { getEmailsFromDB } = require('../database');

export default async function handler(req, res) {
  try {
    const dbEmails = await getEmailsFromDB();
    console.log(`Retrieved ${dbEmails.length} emails from database`);
    res.status(200).json(dbEmails);
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json({ error: 'Failed to get emails' });
  }
}