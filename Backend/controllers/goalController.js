const Goal = require("../models/Goal");

exports.createGoal = async (req, res) => {
  try {
    const { title, subjectId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newGoal = new Goal({
      userId: req.user.id,
      title,
      subjectId: subjectId || undefined,
      dueDate,
    });

    await newGoal.save();

    return res.status(201).json({
      message: "Goal created successfully",
      goal: newGoal,
    });
  } catch (error) {
    console.error("Error creating goal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, status } = req.query;

    let filter = { userId };

    if (subjectId) {
      filter.subjectId = subjectId;
    }

    if (status) {
      filter.status = status;
    }

    const goals = await Goal.find(filter)
      .populate("subjectId", "name")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      goals,
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch goals",
    });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.goalId;
    const { title, status, dueDate, subjectId } = req.body;

    // Find goal and make sure it belongs to this user
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found or unauthorized",
      });
    }

    if (title) goal.title = title;
    if (status) goal.status = status;
    if (dueDate) goal.dueDate = dueDate;
    if (subjectId) goal.subjectId = subjectId;

    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      goal,
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update goal",
    });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.goalId;

    const goal = await Goal.findOneAndDelete({ _id: goalId, userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete goal",
    });
  }
};
