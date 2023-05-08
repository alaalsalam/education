// frappe.listview_settings['Student Group'] = {
// 	add_fields: ["room", "class_division","academic_year"],
// 	filters: [["academic_year", "=", "2023 - 2024"],
  
// ],
	

// };
frappe.listview_settings['Student Group'] = {
	// hide_name_column: true,
	add_fields: ["academic_year"],
	filters: [["academic_year", "!=", "2023 - 2024"]],
	get_indicator: function (doc) {
		if (doc.seating_capacity == doc.number_of_students) {
			return [__("IS Full"), "orange"];
		} 
    else if(doc.number_of_students == 0){
			return [__("is Empaty"), "blue"];

    }
    else{
			return [__("Not Full"), "green"];

    }
	}
};
