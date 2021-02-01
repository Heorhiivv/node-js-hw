const {Router} = require("express")
const contactsController = require("../controllers/contacts.controllers")

const router = Router()

router.get("/", contactsController.getContacts);
router.get("/:contactId", contactsController.validateContactId, contactsController.getById);
router.post("/", contactsController.validateCreateUser, contactsController.addContact);
router.delete("/:contactId", contactsController.validateContactId, contactsController.removeContact);
router.patch(
  "/:contactId",
  contactsController.validateContactId,
  contactsController.validateupdateContact,
  contactsController.updateContact
);

module.exports = router;
