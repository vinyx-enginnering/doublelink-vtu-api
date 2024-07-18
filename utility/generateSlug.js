function generateSlug(name) {
    // Trim leading/trailing spaces
    name = name.trim();
  
    // Replace unwanted characters with hyphens
    return name.replace(/[\s+!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, '-').toLowerCase();
  }

  export default generateSlug;