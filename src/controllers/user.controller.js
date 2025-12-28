export const getProfile = (req, res) => {
  // req.user comes from auth.middleware.js
  res.status(200).json({
    message: "User profile fetched successfully",
    user: req.user
  });
};
