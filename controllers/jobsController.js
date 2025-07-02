const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Jobs = require("../models/jobs");
const APIFilters = require("../utils/apiFilters");
const ErrorHandler = require("../utils/errorHandler");
const geoCoder = require("../utils/geoCoder");
const qs = require("qs");
const fs = require("fs");
const path = require("path");
const { default: slugify } = require("slugify");

exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const parsedQuery = qs.parse(req.query);
  const apiFilters = new APIFilters(Jobs.find(), parsedQuery)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination();
  const allJobs = await apiFilters.query;

  res.status(200).json({
    success: true,
    results: allJobs.length,
    data: allJobs,
  });
});

exports.newJob = catchAsyncErrors(async (req, res, next) => {
    req.body.user = req.user.id;

    const job = await Jobs.create(req.body);

    res.status(200).json({
      success: true,
      message: "Job Created!",
      data: job,
    });
});

exports.getJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Jobs.find({
    $and: [
      {
        _id: req.params.id,
      },
      {
        slug: req.params.slug,
      },
    ],
  })
  .populate({
    path: 'user',
    select: "name"
  });

  if (!job || job.length === 0) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Jobs.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  if(job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler(`User(${req.user.id}) is not allowed to update this job.`, 403));
  }

  if(req.body.hasOwnProperty("title")) {
    await Jobs.findByIdAndUpdate(req.params.id, {slug: slugify(req.body.title, {lower: true})}, {
      new: true,
      runValidators:true
    });
  }

  job = await Jobs.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Job detail is successfully updated!",
    data: job,
  });
});

exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Jobs.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  if(job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler(`User(${req.user.id}) is not allowed to delete this job.`, 403));
  }

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    let filepath = `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace(
      "\\controllers",
      ""
    );
    console.log(filepath);

    fs.unlink(filepath, (err) => {
      if (err) {
        return console.log(err);
      }
    });
  }

  job = await Jobs.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully!",
  });
});

exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  const getLatitudeLongitude = await geoCoder.geocode(zipcode);
  const latitude = getLatitudeLongitude[0].latitude;
  const longitude = getLatitudeLongitude[0].longitude;
  const radius = distance / 3963.2;

  const jobs = await Jobs.find({
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius],
      },
    },
  });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

exports.jobStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Jobs.aggregate([
    {
      $match: {
        $text: { $search: '"' + req.params.topic + '"' },
      },
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: "$positions" },
        averageSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return next(new ErrorHandler(`No stats for: ${req.params.topic}`, 404));
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

exports.applyJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Jobs.findById(req.params.id).select("+applicantsApplied");

  if(!job) {
    return next(new ErrorHandler("Job Not FOund!", 404));
  }

  if(job.lastDate < new Date(Date.now())) {
    return next(new ErrorHandler("You can not apply for this Job. Date is overdue!", 400));
  }

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    if(job.applicantsApplied[i] === req.user.id) {
      return next(new ErrorHandler("You have already applied for this Job!", 400));
    }
  }

  if(!req.files) {
    return next(new ErrorHandler("Please upload file", 400));
  }

  const file = req.files.file;

  const supportedFiles = /.docx||.pdf/;

  if(!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload document file", 400));
  }

  if(file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please upload file that is less than 2MB!", 400));
  }

  file.name = `${req.user.name.replace(" ", "_")}_${job._id}${path.parse(file.name).ext}`;
  const uploadPath = path.resolve(process.env.UPLOAD_PATH);

  file.mv(`${uploadPath}/${file.name}`, async err => {
    if(err) {
      console.log(err);
      return next(new ErrorHandler("Resume upload failed!", 500));
    }
    await Jobs.findByIdAndUpdate(req.params.id, {$push: {
      applicantsApplied: {
        id: req.user.id,
        resume: file.name
      }
    }}, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: "Applied to Job successfully.",
      data: file.name
    });
  });
});
