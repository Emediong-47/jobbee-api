const express = require("express");
const { getUserProfile, updatePassword, updateUserData, deleteUser, getAppliedJobs, getPublishedJobs, getUsers, deleteUserAdmin } = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();

router.use(isAuthenticatedUser);

router.route("/me").get(getUserProfile);

router.route("/jobs/applied").get(authorizeRoles("user"), getAppliedJobs);
router.route("/jobs/published").get(authorizeRoles("employer", "admin"), getPublishedJobs);

router.route("/password/update").put(updatePassword);
router.route("/me/update").put(updateUserData);

router.route("/me/delete").delete(deleteUser);

router.route("/users").get(authorizeRoles("admin"), getUsers);
router.route("/user/:id").delete(authorizeRoles("admin"), deleteUserAdmin);

module.exports = router;