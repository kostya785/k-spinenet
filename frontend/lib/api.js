export async function predictImage(file) {
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });
  
    return await res.json();
  }
  