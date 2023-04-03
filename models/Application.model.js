const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    developerEmail: {
      type: String,
      required: true,
      // must be a valid email address
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    applicationName: {
      type: String,
      required: true,
      unique: true,
      // must be unique and in the format of "applicationName" (camelCase and no spaces)
      validate: {
        validator: function (v) {
          return /^[a-z][a-z0-9]*$/.test(v);
        },
        message: (props) => `${props.value} is not a valid application name`,
      },
    },
    origin: {
      type: String,
      required: true,
      // must be a valid url
      validate: {
        validator: function (v) {
          return /^(http|https):\/\/[a-zA-Z0-9-_.]+(:[0-9]+)?(\/.*)?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid origin url`,
      },
    },
    fileCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Application = mongoose.model("Application", applicationSchema);
module.exports = Application;
