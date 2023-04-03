const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    applicationName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "video", "audio", "document", "other"],
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uuid: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Resource = mongoose.model("Resource", resourceSchema);
module.exports = Resource;
