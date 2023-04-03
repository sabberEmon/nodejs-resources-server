const Application = require("../models/Application.model");

exports.registerAplication = async (req, res) => {
  const { developerEmail, applicationName, origin } = req.body;

  if (!developerEmail || !applicationName || !origin) {
    return res.status(400).json({
      success: false,
      error: "missing_required_fields",
      message: "Please provide all required fields",
    });
  }

  try {
    // check if application already registered
    const application = await Application.findOne({
      applicationName,
    });

    if (application) {
      return res.status(400).json({
        success: false,
        error: "application_already_registered",
        message: `Application with name ${applicationName} already registered by ${application.developerEmail}`,
      });
    }

    // register application
    const newApplication = new Application({
      developerEmail,
      applicationName,
      origin,
    });

    await newApplication.save();

    return res.status(201).json({
      success: true,
      error: null,
      message: `Application with name ${applicationName} registered successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error",
    });
  }
};
