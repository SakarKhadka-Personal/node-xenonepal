const Product = require("./product.model");
const axios = require("axios");

// Game ID Validation endpoint
const validateGameId = async (req, res) => {
  try {
    const { gameIdCheckerUrl, playerId } = req.body;

    if (!gameIdCheckerUrl || !playerId) {
      return res.status(400).json({
        success: false,
        message: "Game ID checker URL and Player ID are required",
      });
    }

    // Extract the base URL and append the player ID
    const apiUrl = `${gameIdCheckerUrl}/${playerId}`;

    const options = {
      method: "GET",
      url: apiUrl,
      headers: {
        "x-rapidapi-key": "67bf47ee3dmsh5fb7e15ab6c31aep194600jsnac0703cdac1e",
        "x-rapidapi-host": "id-game-checker.p.rapidapi.com",
      },
      timeout: 10000, // 10 second timeout
    };

    const response = await axios.request(options);

    // Check if the response contains username data
    if (response.data && response.data.data && response.data.data.username) {
      return res.status(200).json({
        success: true,
        username: response.data.data.username,
        data: response.data,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Player ID not found or invalid",
      });
    }
  } catch (error) {
    console.error("❌ Error validating game ID:", error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      console.log("API Response Status:", error.response.status);
      console.log("API Response Data:", error.response.data);

      if (error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Player ID not found",
        });
      } else if (error.response.status === 429) {
        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded. Please try again later.",
        });
      } else {
        return res.status(error.response.status).json({
          success: false,
          message: `API Error: ${error.response.statusText}`,
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log("No response received from API");
      return res.status(500).json({
        success: false,
        message: "No response from game ID validation service",
      });
    } else {
      // Something happened in setting up the request
      console.log("Request setup error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to validate game ID",
      });
    }
  }
};

const postAProduct = async (req, res) => {
  try {
    const newProduct = new Product({ ...req.body });
    await newProduct.save();
    res
      .status(200)
      .send({ message: "Product Created Successfully", newProduct });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .send({ message: "Validation Error", errors: error.errors });
    }
    console.error("Error creating product", error);
    res.status(500).send({ message: "Failed to create product" });
  }
};

// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res
      .status(200)
      .send({ message: "Products fetched successfully", products });
  } catch (error) {
    console.error("Error fetching products", error);
    res.status(500).send({ message: "Failed to fetch products from db" });
  }
};

// Get Single Product
const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).send({ message: "Product Not Found" });
    }
    res.status(200).send({ message: "Product fetched successfully", product });
  } catch (error) {
    console.error("Error fetching product", error);
    res.status(500).send({ message: "Failed to fetch product    " });
  }
};

// Edit Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).send({ message: "Product Not Found" });
    }

    res.status(200).send({
      message: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error Updating product", error);
    res.status(500).send({ message: "Failed to Update product    " });
  }
};

//  Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).send({ message: "Product Not Found" });
    }

    res.status(200).send({
      message: "Product Deleted Successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error Deleing  product", error);
    res.status(500).send({ message: "Failed to Delete product    " });
  }
};

module.exports = {
  postAProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  validateGameId,
};
