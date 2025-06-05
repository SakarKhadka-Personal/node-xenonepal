const Product = require("./product.model");

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
      res.status(404).send({ message: "Product Not Found" });
    }
    res.status(200).send(product);
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

    if (!updateProduct) {
      res.status(404).send({ message: "Product Not Found" });
    }

    res
      .status(200)
      .send({ message: "Product Updated Successfully", updateProduct });
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

    if (!deleteProduct) {
      res.status(404).send({ message: "Product Not Found" });
    }

    res
      .status(200)
      .send({ message: "Product Deleted Successfully", deleteProduct });
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
};
