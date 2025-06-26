const express = require("express");
const { getJobs, newJob, getJobsInRadius, updateJob, deleteJob, getJob, jobStats, applyJob } = require("../controllers/jobsController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();

router.route("/jobs").get(getJobs);
router.route("/job/:id/:slug").get(getJob);
router.route("/job/new").post(isAuthenticatedUser, authorizeRoles("employer", "admin"),newJob);
router.route("/jobs/:zipcode/:distance").get(getJobsInRadius);
router.route("/job/:id/apply").put(isAuthenticatedUser, authorizeRoles("user"), applyJob);
router.route("/stats/:topic").get(jobStats);
router.route("/job/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin", "employer"), updateJob)
  .delete(isAuthenticatedUser, authorizeRoles("admin", "employer"), deleteJob);

module.exports = router;