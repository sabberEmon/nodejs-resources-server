const Resource = require("../models/Resource.model");
const Application = require("../models/Application.model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, path.join(__dirname, "..", "uploads", "images"));
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, path.join(__dirname, "..", "uploads", "videos"));
    } else if (file.mimetype.startsWith("audio/")) {
      cb(null, path.join(__dirname, "..", "uploads", "audios"));
    } else if (
      file.mimetype.startsWith("application/pdf") ||
      file.mimetype.startsWith("text/plain") ||
      file.mimetype.startsWith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      cb(null, path.join(__dirname, "..", "uploads", "documents"));
    } else {
      cb(null, path.join(__dirname, "..", "uploads", "others"));
    }
  },
  filename: function (req, file, cb) {
    // remove spaces and special characters from file name
    const fileName = file.originalname
      .split(".")[0]
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");

    cb(null, `${fileName}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// initialize upload
const upload = multer({
  storage: storage,
}).single("file");

exports.singleUploadHandler = async (req, res) => {
  const { applicationName } = req.query;

  if (!applicationName) {
    return res.status(400).json({
      success: false,
      error: "missing_required_fields",
      message: "Please provide all required fields",
    });
  }

  try {
    // find application
    const application = await Application.findOne({
      applicationName,
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        error: "application_not_found",
        message: `Application with name ${applicationName} not found`,
      });
    }

    // upload file
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
          message: "Internal server error",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "file_not_found",
          message: "Please provide a file",
        });
      }

      let fileType = req.file.mimetype.split("/")[0];

      // if file type is not image, video, audio see if it is a document or other
      if (
        fileType === "application/pdf" ||
        fileType === "text/plain" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        fileType = "document";
      } else if (
        fileType !== "image" &&
        fileType !== "video" &&
        fileType !== "audio"
      ) {
        fileType = "other";
      }

      // find the appropiate folder
      let folder = "";
      if (fileType === "image") {
        folder = "images";
      } else if (fileType === "video") {
        folder = "videos";
      } else if (fileType === "audio") {
        folder = "audios";
      } else if (fileType === "document") {
        folder = "documents";
      } else {
        folder = "others";
      }

      // get stored file name
      const storedFileName = req.file.filename;

      // save file to database
      const newResource = new Resource({
        applicationName,
        fileName: req.file.originalname,
        size:
          req.file.size / 1024 / 1024 < 1
            ? `${(req.file.size / 1024).toFixed(2)} KB`
            : `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        type: fileType,
        path: `uploads/${folder}/${storedFileName}`,
        url: `${process.env.BASE_URL}/uploads/${folder}/${storedFileName}`,
        uuid: uuidv4(),
      });

      await newResource.save();

      // increment file count
      await Application.findOneAndUpdate(
        { applicationName },
        { $inc: { fileCount: 1 } }
      );

      return res.status(201).json({
        success: true,
        error: null,
        message: "File uploaded successfully",
        data: newResource,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error",
    });
  }
};

exports.getFileDetailsByUuid = async (req, res) => {
  const { uuid } = req.params;

  if (!uuid) {
    return res.status(400).json({
      success: false,
      error: "missing_required_fields",
      message: "Please provide all required fields",
    });
  }

  try {
    // find file
    const file = await Resource.findOne({
      uuid,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "file_not_found",
        message: `File with uuid ${uuid} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      error: null,
      message: "File details retrieved successfully",
      data: file,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error",
    });
  }
};

exports.deleteFileByUuid = async (req, res) => {
  const { uuid } = req.params;

  if (!uuid) {
    return res.status(400).json({
      success: false,
      error: "missing_required_fields",
      message: "Please provide all required fields",
    });
  }

  try {
    // find file
    const file = await Resource.findOne({
      uuid,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "file_not_found",
        message: `File with uuid ${uuid} not found`,
      });
    }

    // delete file record from database
    await Resource.findOneAndDelete({
      uuid,
    });

    // delete file from uploads folder
    fs.unlinkSync(
      path.join(
        __dirname,
        "..",
        file.path.split("/")[0],
        file.path.split("/")[1],
        file.path.split("/")[2]
      )
    );

    // decrement file count
    await Application.findOneAndUpdate(
      { applicationName: file.applicationName },
      { $inc: { fileCount: -1 } }
    );

    return res.status(200).json({
      success: true,
      error: null,
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error",
    });
  }
};
