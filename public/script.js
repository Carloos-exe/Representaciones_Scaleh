async function fetchAndDisplayProducts(searchInput = "") {
    try {
      // Realiza la solicitud al backend
      const response = await fetch(`/products/buscar?termino=${encodeURIComponent(searchInput)}`);
      const products = await response.json();
  
      const productsContainer = document.getElementById("products");
      productsContainer.innerHTML = ""; // Limpia los productos actuales
  
      // Renderiza los productos
      if (products.length === 0) {
        productsContainer.innerHTML = "<p>No se encontraron productos.</p>";
      } else {
        products.forEach((product) => {
          // Crea la tarjeta de producto
          let card = document.createElement("div");
          card.classList.add("card");
  
          // Imagen del producto
          let imgContainer = document.createElement("div");
          imgContainer.classList.add("image-container");
          let image = document.createElement("img");
          image.setAttribute("src", product.image);
          imgContainer.appendChild(image);
          card.appendChild(imgContainer);
  
          // Información del producto
          let container = document.createElement("div");
          container.classList.add("container");
  
          let name = document.createElement("h5");
          name.classList.add("product-name");
          name.innerText = product.productName.toUpperCase();
          container.appendChild(name);
  
          let price = document.createElement("h6");
          price.innerText = "$" + product.price;
          container.appendChild(price);
  
          card.appendChild(container);
          productsContainer.appendChild(card);
        });
      }
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      document.getElementById("products").innerHTML = "<p>Error al cargar los productos.</p>";
    }
  }
  
  // Evento para buscar productos
  document.getElementById("search").addEventListener("click", () => {
    const searchInput = document.getElementById("search-input").value;
    fetchAndDisplayProducts(searchInput);
  });
  
  // Cargar todos los productos al inicio
  window.onload = () => {
    fetchAndDisplayProducts();
  };
  