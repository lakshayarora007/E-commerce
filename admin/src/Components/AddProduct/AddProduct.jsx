import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const BACKEND_URL = "https://e-comm-backend-viqg.onrender.com";

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    image: "",
    category: "women",
    new_price: "",
    old_price: "",
  });
  const [loading, setLoading] = useState(false);

  const imageHandler = (e) => {
    setImage(e.target.files[0]);
  };

  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const Add_Product = async () => {
    if (!productDetails.name || !productDetails.new_price || !productDetails.old_price || !image) {
      alert("Please fill all fields and select an image.");
      return;
    }

    setLoading(true);
    try {
      // 🔹 Upload image first
      const formData = new FormData();
      formData.append("product", image);

      const uploadResp = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResp.json();

      if (!uploadData.success) {
        alert("Image upload failed.");
        setLoading(false);
        return;
      }

      // 🔹 Add product with uploaded image URL
      const product = { ...productDetails, image: uploadData.image_url };

      const addResp = await fetch(`${BACKEND_URL}/addproduct`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const addData = await addResp.json();

      if (addData.success) {
        alert("Product Added Successfully!");
        setProductDetails({
          name: "",
          image: "",
          category: "women",
          new_price: "",
          old_price: "",
        });
        setImage(null);
      } else {
        alert("Failed to add product.");
      }

    } catch (err) {
      console.error("AddProduct Error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='add-product'>
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input
          value={productDetails.name}
          onChange={changeHandler}
          type="text"
          name='name'
          placeholder='Type here'
        />
      </div>

      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.old_price}
            onChange={changeHandler}
            type="text"
            name="old_price"
            placeholder='Type here'
          />
        </div>

        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={productDetails.new_price}
            onChange={changeHandler}
            type="text"
            name="new_price"
            placeholder='Type here'
          />
        </div>
      </div>

      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={productDetails.category}
          onChange={changeHandler}
          name='category'
          className='add-product-selector'
        >
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kid">Kid</option>
        </select>
      </div>

      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img
            src={image ? URL.createObjectURL(image) : upload_area}
            className='addproduct-thumbnail-img'
            alt="Upload Preview"
          />
        </label>
        <input
          onChange={imageHandler}
          type="file"
          name='image'
          id='file-input'
          hidden
        />
      </div>

      <button onClick={Add_Product} className='addproduct-btn' disabled={loading}>
        {loading ? "Adding..." : "ADD"}
      </button>
    </div>
  );
};

export default AddProduct;
