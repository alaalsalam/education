cur_frm.add_fetch('student', 'student_name', 'student_name');

frappe.ui.form.on('Student Group', {
	
	onload: function(frm) {
		// company = frappe.db.get_single_value("Global Defaults", "default_company")
		// console.log("--->Year",company)
		frm.set_query('academic_term', function() {
			return {
				filters: {
					'academic_year': (frm.doc.academic_year)
				}
			};
		});
		frm.set_query("program", function () {
			return {
				filters: [
					["Program", "student_batch_name", "=", frm.doc.student_batch_name]
				]
			}
		});
		if (!frm.__islocal) {
			frm.set_query('student', 'students', function() {
				return{
					query: 'education.students_affairs.doctype.student_group.student_group.fetch_students',
					filters: {
						'academic_year': frm.doc.academic_year,
						// 'academic_term': frm.doc.academic_term,
						'program': frm.doc.program,
						// // 'student_category': frm.doc.student_category,
						// 'student_group': frm.doc.name
					}
				}
			});
		}
	},

	refresh: function(frm) {
		if (!frm.doc.__islocal) {
				frm.events.get_students(frm)

			frm.add_custom_button(__('Add Guardians to Email Group'), function() {
				frappe.call({
					method: 'education.education.api.update_email_group',
					args: {
						'doctype': 'Student Group',
						'name': frm.doc.name
					}
				});
			}, __('Actions'));

			frm.add_custom_button(__('Student Attendance Tool'), function() {
				frappe.route_options = {
					based_on: 'Student Group',
					student_group: frm.doc.name
				}
				frappe.set_route('Form', 'Student Attendance Tool', 'Student Attendance Tool');
			}, __('Tools'));

			frm.add_custom_button(__('Course Scheduling Tool'), function() {
				frappe.route_options = {
					student_group: frm.doc.name
				}
				frappe.set_route('Form', 'Course Scheduling Tool', 'Course Scheduling Tool');
			}, __('Tools'));

			frm.add_custom_button(__('Newsletter'), function() {
				frappe.route_options = {
					'Newsletter Email Group.email_group': frm.doc.name
				}
				frappe.set_route('List', 'Newsletter');
			}, __('View'));

		}
	},
	get_students: function(frm) {
			var student_list = [];
			var max_roll_no = 0;
			if(frm.doc.academic_year && frm.doc.updated){
				console.log("zizoo")
				frm.set_value("students",[]);
				if (frm.doc.academic_year) {
					frappe.call({
						method: 'education.students_affairs.doctype.student_group.student_group.get_program_enrollment',
						args: {
							'academic_year': frm.doc.academic_year,
							'academic_term': frm.doc.academic_term,
							'program': frm.doc.program,
							// 'student_category' : frm.doc.student_category,
							'student_group':frm.doc.name,
						},
						callback: function(r) {

							if (r.message) {
								frm.set_value("number_of_students", r.message.length);
								refresh_field('number_of_students');

								$.each(r.message, function(i, d) {
									if(!in_list(student_list, d.student)) {
										var s = frm.add_child('students');
										s.student = d.name;
										s.student_name = d.student_name;
										s.student_group = d.student_group;
										if (d.active === 0) {
											s.active = 0;
										}
										s.group_roll_number = ++max_roll_no;
										if (frm.doc.seating_capacity <= max_roll_no){
											return false
										}

									}
								});
								
								refresh_field('students');
								frm.doc.updated = 0;
								frm.save();
								// frm.save();
							} else {
								frappe.msgprint(__('Student Group is already updated.'))
							}
						}
					})
				}	
			}
	},
});

frappe.ui.form.on('Student Group Instructor', {
	instructors_add: function(frm){
		frm.fields_dict['instructors'].grid.get_field('instructor').get_query = function(doc){
			let instructor_list = [];
			$.each(doc.instructors, function(idx, val){
				instructor_list.push(val.instructor);
			});
			return { filters: [['Instructor', 'name', 'not in', instructor_list]] };
		};
	}
});
