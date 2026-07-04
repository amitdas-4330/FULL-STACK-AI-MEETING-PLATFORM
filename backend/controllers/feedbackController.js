const Feedback = require("../models/Feedback");

const allowedTypes = new Set([
  "General feedback",
  "Bug report",
  "Feature request",
  "Meeting experience",
]);

const createFeedback = async (req, res) => {

  try {

    const {
      name = "",
      email = "",
      type = "General feedback",
      rating = 5,
      message = "",
    } = req.body;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();
    const numericRating = Number(rating);

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({
        message: "Name, email, and feedback are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!allowedTypes.has(type)) {
      return res.status(400).json({
        message: "Please select a valid feedback type.",
      });
    }

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const feedback = await Feedback.create({
      name: trimmedName,
      email: trimmedEmail,
      type,
      rating: numericRating,
      message: trimmedMessage,
    });

    res.status(201).json({
      success: true,
      feedback,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message || "Could not save feedback.",
    });

  }

};

module.exports = {
  createFeedback,
};
