  // Prepare candidate data with type conversions and validations
  const candidateData = {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.trim() || null,  // Send null if empty
    position: formData.position.trim(),
    experience: formData.experience 
      ? parseFloat(formData.experience) || null
      : null,
    skills: formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
      .join(','),
    notes: formData.notes.trim() || null,
    stage: formData.stage.toLowerCase(),  // Convert stage to lowercase to match backend enum
    status: "active",  // Add default status
    // Add created_by field - replace with actual logic to get current user's name
    created_by: "CurrentUser" // <<< REPLACE THIS WITH ACTUAL USER NAME
  };

  const response = await api.post("/api/recruitment/candidates", candidateData);

  if (response.data) {
    // Handle successful response
  } else {
    // Handle error
  }
} 