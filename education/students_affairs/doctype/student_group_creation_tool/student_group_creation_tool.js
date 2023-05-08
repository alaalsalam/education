// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Student Group Creation Tool', {
	
	refresh: function(frm) {
		frm.disable_save();
		frm.refresh_field("academic_year")
		
		
		if (!frm.doc.program){
			frm.set_value(frm.doc.students_out_groups , 0);
			frm.set_value(frm.doc.number_of_students , 0);
			frm.set_value("rooms",[]);
			frm.set_df_property('rooms', 'hidden', 1);
			frm.set_df_property('students_out_groups', 'hidden', 1);
			frm.set_df_property('number_of_students', 'hidden', 1);
			frm.set_df_property('get_rooms', 'hidden', 1);

		}

		// frm.set_query('room', 'rooms', function() {
		// 	return {
		// 		'filters':{
		// 			'program': frm.doc.program
		// 		}
		// 	};
		// });

		
	},

	get_rooms: function(frm) {
		frm.set_value("rooms",[]);
		if (frm.doc.academic_year && frm.doc.program) {
			frappe.call({
				method: "get_room",
				doc:frm.doc,
				callback: function(r) {
					console.log("---->",r.message)
					if(r.message.length > 0) {
						frm.set_value("rooms", r.message);
					}else{
						frappe.msgprint("There isn't any <b>Room</b> Linked with that Program<br>"+
										"<b> - First:</b> Add new Row<br>"+
										"<b> - Then:</b> Chose from available rooms"
										)
					}
				}
			})
		}
	},
	program: function(frm) {
		if (frm.doc.academic_year && frm.doc.program) {
			frappe.call({
				method: "get_number_of_student_in_groups",
				doc:frm.doc,
				callback: function(r) {
					refresh_field('number_of_students');
					refresh_field('students_out_groups');
					if(frm.doc.students_out_groups == frm.doc.number_of_students && frm.doc.number_of_students != 0){
						frm.set_df_property('rooms', 'hidden', 0);
						frm.set_df_property('students_out_groups', 'hidden', 0);
						frm.set_df_property('number_of_students', 'hidden', 0);
						frm.set_df_property('get_rooms', 'hidden', 0);
						// frm.events.get_rooms(frm);

					}
					else{
						// frappe.throw(_("{0}Student Group Name is mandatory in row {0}").format(d.idx))
						frappe.msgprint( "Program <b>" + frm.doc.program +"</b> already has groups")
						frm.set_value("program", "");
					}
				}
			})
			
				
		}
		else{
				// frm.set_df_property('rooms', 'hidden', 1);
				// frm.set_df_property('students_out_groups', 'hidden', 1);
				// frm.set_df_property('number_of_students', 'hidden', 1);
				// frm.set_df_property('get_rooms', 'hidden', 1);
				frm.set_value('rooms', "");
				frm.set_value('students_out_groups', "");
				frm.set_value('number_of_students', "");
				frm.set_df_property('get_rooms', 'hidden', 1);
				
		}

	},
	set_students_total: function(frm,cdt,cdn) {
		var total = 0;
		if(cur_frm.doc.rooms.length){
			cur_frm.doc.rooms.forEach(r => {
				if (r.number_of_students){
			 		total += r.number_of_students
				}
			});
			if(total > cur_frm.doc.number_of_students ){
				var row = locals[cdt][cdn]
				frappe.model.set_value( row.doctype, row.name, "number_of_students", 0)
				frappe.msgprint(__("You Just have <b>"+ frm.doc.students_out_groups +"</b> Student out of Group"))	

			}
			else
				frm.set_value("students_out_groups", cur_frm.doc.number_of_students - total);
		}
		else {
			frm.set_value("students_out_groups", cur_frm.doc.number_of_students);
		}
		frm.events.create_student_groups(frm)
		
	},
	create_student_groups:function(frm){
		if(frm.doc.program ){ // frm.doc.students_out_groups == 0
			frm.page.set_primary_action(__("Create Student Groups"), function() {
				frappe.call({
					method: "create_student_groups",
					doc:frm.doc
				})
			});
		}else{
			frm.remove_custom_button(__("Create Student Groups"))
		}
	},
});
	
frappe.realtime.on("student_group_creation_progress", function(data) {
	if(data.progress) {
		frappe.hide_msgprint(true);
		frappe.show_progress(__("Creating student groups"), data.progress[0],data.progress[1]);
	}
});
// frappe.ui.form.on("Student Group Creation Tool", "onload", function(frm){
// 	cur_frm.set_query("academic_term",function(){
// 		return{
// 			"filters":{
// 				"academic_year": (frm.doc.academic_year)
// 			}
// 		};
// 	});
	
// });
frappe.ui.form.on('Student Group Creation Tool Rooms', {
	
	rooms_add: function(frm){
		frm.fields_dict['rooms'].grid.get_field('room').get_query = function(doc){
			let room_list = [];
			$.each(doc.rooms, function(val){
				room_list.push(val.room);
			});
			return { 
				filters: [
						['Room', 'name', 'not in', room_list],			
						['Room','program', '=',''],
						['Room','used', '=',0],
					]
				};

		};
	},
	number_of_students: function(frm,cdt,cdn){
		if(frm.doc.number_of_students){
			var row = locals[cdt][cdn]
			cur_frm.events.set_students_total(frm,cdt,cdn)

		}
		
		
	}
	
});
