import React, { useState, useContext } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/frontend_assets/assets'

const Home = () => {
  const [category,setCategory]=useState("All");
  const { getTotalCartItems } = useContext(StoreContext);
  const navigate = useNavigate();
  
  return (
    <div>
      <Header/>
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>
      <AppDownload/>
      
      {/* Floating Cart Icon */}
      {getTotalCartItems() > 0 && (
        <div className="floating-cart-icon" onClick={() => navigate('/cart')}>
          <img src={assets.basket_icon} alt="Cart" />
          <span className="cart-badge">{getTotalCartItems()}</span>
        </div>
      )}
    </div>
  )
}

export default Home