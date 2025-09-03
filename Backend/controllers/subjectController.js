const Subject = require("../models/Subject");

// Add a new subject with target
exports.createSubject = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      trackingType,
      targetPerDayMinutes,
      targetPerDayQuestions,
      colorCode,
    } = req.body;

    //validation as name and type are necessary
    if (!name || !trackingType) {
      return res.status(400).json({
        success: false,
        message: "Subject name and tracking type are required",
      });
    }

    // prevent duplicate subject name with same UserID
    const existing = await Subject.findOne({ name, userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Subject with this name already exists",
      });
    }

    const newSubject = await Subject.create({
      userId,
      name,
      trackingType,
      targetPerDayMinutes:
        trackingType !== "questions" ? targetPerDayMinutes : undefined,
      targetPerDayQuestions:
        trackingType !== "time" ? targetPerDayQuestions : undefined,
      colorCode,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject: newSubject,
    });
  } catch (error) {
    console.error("Error in createSubject:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating subject",
    });
  }
};

// fetch all subject of the user
exports.getSubjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const subjects = await Subject.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      subjects,
    });
  } catch (error) {
    console.error("Error in getSubjects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};

// update the value of subject
exports.updateSubject = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const {
      name,
      trackingType,
      targetPerDayMinutes,
      targetPerDayQuestions,
      colorCode,
    } = req.body;

    // check if the corresponding subject is present or not
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // check if user of subject is same as user which is requesting to update
    if (subject.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this subject",
      });
    }

    // Update fields only if they are provided
    if (name) subject.name = name;
    if (trackingType) subject.trackingType = trackingType;

    // Update target fields conditionally
    if (trackingType !== "questions" && targetPerDayMinutes !== undefined) {
      subject.targetPerDayMinutes = targetPerDayMinutes;
    }
    if (trackingType !== "time" && targetPerDayQuestions !== undefined) {
      subject.targetPerDayQuestions = targetPerDayQuestions;
    }
    if (colorCode) subject.colorCode = colorCode;

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Error in updateSubject:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subject",
    });
  }
};

// for deleting a subject
exports.deleteSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.id;

    const subject = await Subject.findById(subjectId);

    // if subject does not exist with given id
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (subject.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this subject",
      });
    }

    await Subject.findByIdAndDelete(subjectId);

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteSubject:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subject",
    });
  }
};
