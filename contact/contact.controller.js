const {
  Types: {ObjectId},
} = require('mongoose');

const Joi = require('joi')
const Contact = require('./Contact');

async function getContacts (req, res) {
  const contacts = await Contact.find();
  res.json(contacts);
};

async function getContactById (req, res) {
  const {
    params: {contactId},
  } = req;

  const contact = await Contact.findById(contactId)

  if(!contact) {
    return res.status(400).send("User isn't found");
  };
  
  res.json(contact)
};

async function addContact (req, res) {
  try {
    const { body } = req;
    const contact = await Contact.create(body);
    res.json(contact)
  } catch (error) {
    res.status(400).send(error.message)
  }
};

async function deleteContact(req, res) {
  try {
  const {
    params: {contactId},
  } = req;

  await Contact.findByIdAndDelete(contactId);
  res.status(200).send("contact deleted");

  } catch (error) {
    res.status(404).send("Not found");
  }
}
async function updateContact(req, res) {
  const {
    params: {contactId},
  } = req;

  const updatedContact = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
  })

  if (!updatedContact) {
    return res.status(404).send('Not found')
  }

  res.json(updatedContact)
};

function validateId(req, res, next) {
  const {
    params: {contactId},
  } = req;

  if (!ObjectId.isValid(contactId)) {
    return res.status(400).send('ID is not valid')
  }
  
  next();
}
function validateAddContact(req, res, next) {
  const validationRules = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.number().required(),
    subscription: Joi.string().required(),
    password: Joi.string().required(),
  })
  const validationResult = validationRules.validate(req.body)

  if (validationResult.error) {
    return res.status(400).send({message: "missing required field"})
  }

  next()
}

function validateUpdateContact(req, res, next) {
  const validationRules = Joi.object({
    name: Joi.string(),
    email: Joi.string(),
    phone: Joi.string(),
    subscription: Joi.string(),
    password: Joi.string(),
  }).min(1);
  const validationResult = validationRules.validate(req.body)

  if (validationResult.error) {
    return res.status(400).send(validationResult.error)
  }

  next()
}

module.exports = {
  getContacts,
  getContactById,
  addContact,
  deleteContact,
  updateContact,
  validateId,
  validateAddContact,
  validateUpdateContact,
}