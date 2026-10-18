const { Enquiry } = require('../models');
const { fail, ok } = require('../utils');
const mailer = require('../utils/mailer');

async function submitEnquiry(req, res, next) {
  try {
    const { name, firm, email, phone, plan, message } = req.body;

    const trimmedName = String(name || '').trim();
    const trimmedFirm = String(firm || '').trim();
    const trimmedEmail = String(email || '').toLowerCase().trim();
    const trimmedMessage = String(message || '').trim();

    if (!trimmedName || !trimmedFirm || !trimmedEmail || !trimmedMessage) {
      throw fail('Name, firm, email, and message are required', 400, 'MISSING_FIELDS');
    }

    const rawDigits = phone ? String(phone).replace(/\D/g, '') : '';
    // Handle +91 country code (12 digits starting with 91)
    const trimmedDigits = (rawDigits.length === 12 && rawDigits.startsWith('91'))
      ? rawDigits.slice(2)
      : rawDigits;

    if (trimmedDigits && trimmedDigits.length !== 10) {
      throw fail('Please provide a valid 10-digit mobile number', 400, 'INVALID_PHONE');
    }
    const cleanPhone = trimmedDigits ? `+91 ${trimmedDigits}` : '';

    // Save enquiry record in database
    const enquiry = await Enquiry.create({
      name: trimmedName,
      firm: trimmedFirm,
      email: trimmedEmail,
      phone: cleanPhone,
      plan: plan ? String(plan).trim() : 'General',
      message: trimmedMessage,
      status: 'NEW',
    });

    // Send email notification to DexFora team (dexforaofficial@gmail.com)
    const adminDelivery = await mailer.sendEnquiryNotificationEmail({
      name: trimmedName,
      firm: trimmedFirm,
      email: trimmedEmail,
      phone: cleanPhone,
      plan: plan ? String(plan).trim() : 'General',
      message: trimmedMessage,
    });

    // Send confirmation email to the prospect
    const userDelivery = await mailer.sendEnquiryConfirmationToUser({
      name: trimmedName,
      firm: trimmedFirm,
      email: trimmedEmail,
      plan: plan ? String(plan).trim() : 'Chambers',
    });

    if (adminDelivery?.sent || userDelivery?.sent) {
      enquiry.emailSentToAdmin = !!adminDelivery?.sent;
      enquiry.emailSentToUser = !!userDelivery?.sent;
      await enquiry.save().catch(() => {});
    }

    ok(
      res,
      {
        enquiryId: enquiry._id,
        emailDelivered: adminDelivery?.sent || false,
      },
      'Thank you! Your enquiry has been received and sent to our team. We will connect with you shortly.'
    );
  } catch (error) {
    next(error);
  }
}

async function listEnquiries(req, res, next) {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
    ok(res, enquiries, 'Enquiries fetched successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitEnquiry,
  listEnquiries,
};
