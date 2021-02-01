const contacts = require("../db/contacts.json")
const Joi = require('joi')
const {v4: uuidv4} = require("uuid")
const fs = require('fs').promises
const path = require("path")
const contactsPath = path.join(__dirname, '../db/contacts.json')

class contactsController {
  findContactIndex = (contactId) => {
    return contacts.findIndex(({id}) => id === contactId)
  }

  getContacts(req, res) {
    res.json(contacts)
  }

  getById(req, res) {
    const {
      params: {contactId},
    } = req
    const searchId = +contactId
    const contactById = contacts.find((contact) => contact.id === searchId)
    res.json(contactById)
  }

  validateContactId(req, res, next) {
    const {
      params: {contactId},
    } = req
    const searchId = +contactId
    const contactById = contacts.find((contact) => contact.id === searchId)

    if (!contactById) {
      return res.status(404).send({message: "Not found"})
    }
    next()
  }

  addContact(req, res) {
    const {body} = req

    const createdContact = {
      id: uuidv4(),
      ...body,
    }
    contacts.push(createdContact)
    fs.writeFile(contactsPath, JSON.stringify(contacts))
    res.status(201).send(createdContact)
  }

  validateCreateUser(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.number().required(),
    })
    const validationResult = validationRules.validate(req.body)

    if (validationResult.error) {
      return res.status(400).send({message: "missing required name field"})
    }

    next()
  }

  removeContact = (req, res) => {
    const {
      params: {contactId},
    } = req

    const contactIndex = this.findContactIndex(contactId)

    contacts.splice(contactIndex, 1)
    fs.writeFile(contactsPath, JSON.stringify(contacts))
    res.status(200).send({message: "Contact deleted"})
  }

  updateContact = (req, res) => {
    const {
      params: {contactId},
    } = req

    const contactIndex = this.findContactIndex(contactId)
    const updatedContact = {
      ...contacts[contactIndex],
      ...req.body,
    }

    contacts[contactIndex] = updatedContact
    fs.writeFile(contactsPath, JSON.stringify(contacts))
    res.status(200).send(updatedContact)
  }

  validateupdateContact(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
    }).min(1);
    const validationResult = validationRules.validate(req.body)
    if (validationResult.error) {
      return res.status(400).send({message: "missing fields"})
    }

    next()
  }
}

module.exports = new contactsController()
