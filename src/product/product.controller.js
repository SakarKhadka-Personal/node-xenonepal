const Product = require("./product.model");
const axios = require("axios");

// Game ID Validation endpoint
const validateGameId = async (req, res) => {
  try {
    const { gameIdCheckerUrl, playerId, zoneId } = req.body;

    if (!gameIdCheckerUrl || !playerId) {
      return res.status(400).json({
        success: false,
        message: "Game ID checker URL and Player ID are required",
      });
    }

    // Build the API URL - append zone ID if provided
    let apiUrl = `${gameIdCheckerUrl}/${playerId}`;
    if (zoneId) {
      apiUrl += `/${zoneId}`;
    }

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
    // First, validate required fields manually to provide better error messages
    const requiredFields = [
      "title",
      "description",
      "category",
      "coverImage",
      "placeholderUID",
      "placeholderUsername",
      "productQuantity",
    ];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    // Check if productQuantity has at least one item with quantity and price
    if (req.body.productQuantity && req.body.productQuantity.length > 0) {
      for (let i = 0; i < req.body.productQuantity.length; i++) {
        const item = req.body.productQuantity[i];
        if (!item.quantity || item.price === undefined) {
          missingFields.push(
            `productQuantity[${i}] requires quantity and price`
          );
        }
      }
    } else if (!missingFields.includes("productQuantity")) {
      missingFields.push("productQuantity must have at least one item");
    }

    if (missingFields.length > 0) {
      return res.status(400).send({
        message: "Validation Error",
        errors: missingFields.map((field) => ({
          field,
          message: `${field} is required`,
        })),
      });
    }

    // Remove basePrice, maxPrice, and currencyName from request body if they exist
    const { basePrice, maxPrice, currencyName, currecyName, ...productData } =
      req.body;

    // Handle quantityInStock - convert empty string to null for unlimited stock
    if (
      productData.quantityInStock === "" ||
      productData.quantityInStock === undefined
    ) {
      productData.quantityInStock = null;
    }

    // Ensure virtual fields are included in response by explicitly converting to object with virtuals
    const newProduct = new Product(productData);
    await newProduct.save();

    // Convert to object with virtuals for response
    const productWithVirtuals = newProduct.toObject({ virtuals: true });

    res.status(200).send({
      message: "Product Created Successfully",
      newProduct: productWithVirtuals,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      // Format Mongoose validation errors in a more user-friendly way
      const validationErrors = Object.keys(error.errors).map((field) => ({
        field,
        message: error.errors[field].message,
      }));

      return res
        .status(400)
        .send({ message: "Validation Error", errors: validationErrors });
    }
    console.error("Error creating product", error);
    res
      .status(500)
      .send({ message: "Failed to create product", error: error.message });
  }
};

// Get All Products (Public - without cost data)
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Convert to objects with virtuals and then sanitize
    const productsWithVirtuals = products.map((product) =>
      product.toObject({ virtuals: true })
    );
    const sanitizedProducts = productsWithVirtuals.map(
      sanitizeProductForPublic
    );
    res.status(200).send({
      message: "Products fetched successfully",
      products: sanitizedProducts,
    });
  } catch (error) {
    console.error("Error fetching products", error);
    res.status(500).send({ message: "Failed to fetch products from db" });
  }
};

// Get Single Product (Public - without cost data)
const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).send({ message: "Product Not Found" });
    }

    // Convert to object with virtuals and then sanitize
    const productWithVirtuals = product.toObject({ virtuals: true });
    const sanitizedProduct = sanitizeProductForPublic(productWithVirtuals);
    res.status(200).send({
      message: "Product fetched successfully",
      product: sanitizedProduct,
    });
  } catch (error) {
    console.error("Error fetching product", error);
    res.status(500).send({ message: "Failed to fetch product" });
  }
};

// Edit Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove basePrice, maxPrice, and currencyName from request body if they exist
    const { basePrice, maxPrice, currencyName, currecyName, ...productData } =
      req.body;

    // Handle quantityInStock - convert empty string to null for unlimited stock
    if (
      productData.quantityInStock === "" ||
      productData.quantityInStock === undefined
    ) {
      productData.quantityInStock = null;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, productData, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).send({ message: "Product Not Found" });
    }

    // Convert to object with virtuals for response
    const productWithVirtuals = updatedProduct.toObject({ virtuals: true });

    res.status(200).send({
      message: "Product Updated Successfully",
      product: productWithVirtuals,
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

// Helper function to remove sensitive data for public APIs
const sanitizeProductForPublic = (product) => {
  // Ensure we're working with a plain object
  const sanitized = product.toObject
    ? product.toObject({ virtuals: true })
    : product;

  // Remove cost price from product quantities
  if (sanitized.productQuantity) {
    sanitized.productQuantity = sanitized.productQuantity.map((qty) => {
      const { costPrice, ...publicQty } = qty;
      return publicQty;
    });
  }

  // Remove quantityInStock for public APIs (keep it hidden from customers)
  // But keep it for admin APIs
  if (sanitized.quantityInStock !== undefined) {
    delete sanitized.quantityInStock;
  }

  return sanitized;
};

// Admin-only: Get All Products with cost data
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Convert to objects with virtuals for admin view
    const productsWithVirtuals = products.map((product) =>
      product.toObject({ virtuals: true })
    );
    res.status(200).send({
      message: "Products fetched successfully",
      products: productsWithVirtuals,
    });
  } catch (error) {
    console.error("Error fetching products", error);
    res.status(500).send({ message: "Failed to fetch products from db" });
  }
};

// Admin-only: Get Single Product with cost data
const getSingleProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).send({ message: "Product Not Found" });
    }

    // Convert to object with virtuals for admin view
    const productWithVirtuals = product.toObject({ virtuals: true });
    res.status(200).send({
      message: "Product fetched successfully",
      product: productWithVirtuals,
    });
  } catch (error) {
    console.error("Error fetching product", error);
    res.status(500).send({ message: "Failed to fetch product" });
  }
};

module.exports = {
  postAProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  validateGameId,
  getAllProductsAdmin,
  getSingleProductAdmin,
};
