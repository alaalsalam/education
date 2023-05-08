// Copyright (c) 2023, alaalsalam and contributors
// For license information, please see license.txt


frappe.ui.form.on('Committees Setting', {
	refresh: function(frm) {

	},
	// rooms_add: function(frm){
	// 	console.log(123)
	//   frm.fields_dict['rooms'].grid.get_field('room').get_query = function(doc){
	// 	let rooms_list = [];x
	// 	$.each(doc.rooms, function(idx, val){
	// 	  rooms_list.push(val.room);
	// 	});
	// 	return { filters: [['Room', 'name', 'not in', rooms_list]] };
	//   };
	// }
  });

  frappe.ui.form.on('Committees Setting Rooms', {
	rooms_add: function(frm){
	  frm.fields_dict['rooms'].grid.get_field('room').get_query = function(doc){
		let rooms_list = [];x
		$.each(doc.rooms, function(idx, val){
		  rooms_list.push(val.room);
		});
		return { filters: [['Room', 'name', 'not in', rooms_list]] };
	  };
	},
	rooms_remove: function(frm,cdt,cdn){
		var row = locals[cdt][cdn];
		// frappe.db.get_doc("")
	  }
  });
