const  mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");
const geoCoder = require("../utils/geoCoder");

const jobSchema = new mongoose.Schema({
    title: {
        type : String,
        required : [true, "Please enter job title."],
        trim : true,
        maxLength : [100, "Job title can not exceed 100 characters."]
    },
    slug: String,
    description: {
        type : String,
        required : [true, "Please enter job description."],
        maxLength : [1000, "Job description can not exceed 1000 characters."]
    },
    email: {
        type: String,
        validate: [validator.isEmail, "Please enter a valid email address."]
        
    },
    address: {
        type : String,
        required : [true, "Please add an address."]
    },
    location: {
        type: {
            type: String,
            enum: ["Point"]
        },
        coordinates: {
            type:[Number],
            index: "2dsphere"
        },
        formattedAddress: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    company: {
        type : String,
        required : [true, "Please add a Company."]
    },
    industry : {
        type : [String],
        required : [true, "Please enter industry for this Job."],
        enum : {
            values: [
                "Business",
                "Information Technology",
                "Banking",
                "Education/Training",
                "Telecommunication",
                "Others"
            ],
            message: "Please select correct option for industry"
        }
        
    },
    jobType: {
        type: String,
        required: [true, "Please enter Job type"],
        enum: {
            values: [
                "Temporary",
                "Permanent",
                "Contract"
            ],
            message: "Please select correct option for job type"
        }
    },
    minEducation: {
        type: String,
        required: [true, "Please enter minimum Education for this Job."],
        enum: {
            values: [
                "Bachelors",
                "Masters",
                "PhD"
            ],
            message: "Please select correct option of Education"
        }
    },
    positions: {
        type: Number,
        default: 1
    },
    experience: {
        type: String,
        required: [true, "Please enter experience required for this Job"],
        enum: {
            values: [
                "No Experience",
                "1 Year - 2 Years",
                "2 Years - 5 Years",
                "5 Years+"
            ],
            message: "Please select correct option for Experience."
        }
    },
    salary: {
        type: Number,
        required: [true, "Please enter expected salary for this job"],

    },
    postingDate: {
        type: Date,
        default: Date.now
    },
    lastDate: {
        type: Date,
        default: new Date().setDate(new Date().getDate() + 7)
    },
    applicantsApplied: {
        type: [Object],
        select: false
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    }
});

jobSchema.pre("save", function(next) {
    this.slug = slugify(this.title, {lower: true});

    next();
});
jobSchema.pre("save", async function(next) {
    const location = await geoCoder.geocode(this.address);

    this.location = {
        type: "Point",
        coordinates: [location[0].longitude, location[0].latitude],
        formattedAddress: location[0].formattedAddress,
        city: location[0].city,
        state: location[0].state,
        zipcode: location[0].zipcode,
        country: location[0].countryCode

    }

    next();
});

module.exports = mongoose.model("Job", jobSchema);