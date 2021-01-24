const fs = require("fs").promises
const path = require("path")

const contactsPath = path.join(__dirname, "./db/contacts.json")

function listContacts() {
  fs.readFile(contactsPath)
    .then((data) => console.table(JSON.parse(data)))
    .catch((err) => console.log(err.message))
}

function getContactById(contactId) {
  fs.readFile(contactsPath)
    .then((data) => JSON.parse(data))
    .then((data) => console.log(data.find((contact) => contact.id === contactId)))
    .catch((err) => console.log(err.message))
}

function removeContact(contactId) {
  fs.readFile(contactsPath, "utf-8")
    .then((data) => JSON.parse(data))
    .then((data) => {
      const contactsArray = [...data]
      const contactToRemove = contactsArray.filter((contact) => contact.id !== contactId)
      const result = JSON.stringify(contactToRemove)
      fs.writeFile(contactsPath, result, "utf-8")
    })
    .then((data) => console.log("Contact successfully removed"))
    .catch((err) => console.log(err.message))
}

function addContact(name, email, phone) {
  const contact = {
    id: Math.floor(Math.random() * 100),
    name: name,
    email: email,
    phone: phone,
  }
  fs.readFile(contactsPath, "utf-8")
    .then((data) => JSON.parse(data))
    .then((data) => {
      const contacts = [...data, contact]
      const contactsArray = JSON.stringify(contacts)
      fs.writeFile(contactsPath, contactsArray, "utf-8")
    })
    .then((data) => console.log("Contact successfully added"))
    .catch((err) => console.log(err.message))
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
}
