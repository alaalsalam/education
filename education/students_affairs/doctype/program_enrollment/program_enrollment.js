// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Program Enrollment', {
	
	
	refresh(frm) {
		frm.set_query("program", function () {
			return {
				filters: [
					["Program", "student_batch_name", "=", frm.doc.student_batch_name]
				]
			}
		});
		frm.set_query("fee_structure", function () {
			return {
				filters: { 'program': frm.doc.program, 'academic_year': frm.doc.academic_year, 'academic_term': frm.doc.academic_term }

			}
		});
	},
	onload: function(frm) {
		frm.set_query('academic_term', function() {
			return {
				'filters':{
					'academic_year': frm.doc.academic_year
				}
			};
		});
		if(frm.doc.program  && !frm.doc.fee_structure){
			frm.events.get_fee_structure(frm);
		}

		// frm.set_query('academic_term', 'fees', function() {
		// 	return {
		// 		'filters':{
		// 			'academic_year': frm.doc.academic_year
		// 		}
		// 	};
		// });
		frm.set_query("program", function () {
			return {
				filters: [
					["Program", "student_batch_name", "=", frm.doc.student_batch_name]
				]
			}
		});
		frm.set_query("fee_structure", function () {
			return {
				filters: { 'program': frm.doc.program,
				 'academic_year': frm.doc.academic_year,
				 'academic_term': frm.doc.academic_term,
				 
				 }

			}
		});

		// frm.fields_dict['fees'].grid.get_field('fee_structure').get_query = function(doc, cdt, cdn) {
		// 	var d = locals[cdt][cdn];
		// 	return {
		// 		filters: { 'program': frm.doc.program, 'academic_year': frm.doc.academic_year, 'academic_term': frm.doc.academic_term }

		// 	}
		// };

		if (frm.doc.program) {
			frm.set_query('course', 'courses', function() {
				return {
					query: 'education.students_affairs.doctype.program_enrollment.program_enrollment.get_program_courses',
					filters: {
						'program': frm.doc.program
					}
				}
			});
		}

		frm.set_query('student', function() {
			return{
				query: 'education.students_affairs.doctype.program_enrollment.program_enrollment.get_students',
				filters: {
					'academic_year': frm.doc.academic_year,
					'academic_term': frm.doc.academic_term
				}
			}
		});
	},

	program: function(frm) {
		frm.events.get_courses(frm);
		frm.events.get_fee_structure(frm);
	},

	student_category: function() {
		frappe.ui.form.trigger('Program Enrollment', 'program');
	},

	get_courses: function(frm) {
		frm.program_courses = [];
		frm.set_value('courses',[]);
		frappe.call({
			method: 'get_courses',
			doc: frm.doc,
			callback: function(r) {
				if (r.message) {
					frm.program_courses = r.message
					frm.set_value('courses', r.message);
				}
			}
		})
	},
	get_fee_structure: function(frm) {
			if(frm.doc.program){
				frappe.call({
					method: 'education.education.api.get_fee_structure',
					args: {
						'program': frm.doc.program,
						'academic_year': frm.doc.academic_year
					},
					callback: function(r) {
						if (r.message) {
							frm.set_value('fee_structure' ,r.message[0].name);
						}
					}
				});
			}
			
	},
	fee_structure: function(frm) {
		frm.set_value("components" ,"");
		if (frm.doc.fee_structure) {
			frappe.call({
				method: "education.education.api.get_fee_components",
				args: {
					"fee_structure": frm.doc.fee_structure
				},
				callback: function(r) {
					if (r.message) {
						$.each(r.message, function(i, d) {
							console.log(" row ->",r.message)
							var row = frappe.model.add_child(frm.doc, "Fee Component Enrollment", "components");
							row.fees_category = d.fees_category;
							row.description = d.description;
							row.amount = d.amount;
							row.grand_total = d.amount;
							// row.allow_discount = d.allow_discount;	
							frappe.model.set_value(row.doctype, row.name,"allow_discount", d.allow_discount )
						});
					}
					refresh_field("components");
					frm.trigger("calculate_total_amount");
					frm.trigger("read_only_discount");
				}
			});
		}
	},
	discount_percentage: function(frm){
		frm.doc.discount_amount = frm.doc.discount_percentage * frm.doc.grand_total/100
		frm.trigger("calculate_total_amount");
		refresh_field("discount_amount");



	},
	discount_amount: function(frm){
		frm.doc.discount_percentage = (frm.doc.discount_amount / frm.doc.grand_total )*100.0
		frm.trigger("calculate_total_amount");
		refresh_field("discount_percentage");


	},
	calculate_total_amount: function(frm) {
		var grand_total = 0;
		var amount = 0;
		var discount_amount_component = 0 ;

		for(var i=0;i<frm.doc.components.length;i++) {
			grand_total += frm.doc.components[i].grand_total;
			amount += frm.doc.components[i].amount;
			if(frm.doc.components[i].discount_amount){
				discount_amount_component += frm.doc.components[i].discount_amount;
			}
		}
		console.log("--discount_amount_component->",discount_amount_component)
		frm.set_value("amount", amount);
		frm.set_value("discount_amount_component",discount_amount_component)
		grand_total =   grand_total - frm.doc.discount_amount 
		frm.set_value("grand_total", grand_total);
		frm.refresh_fields();

	},
	read_only_discount: function(frm) {
		var c_table = frm.fields_dict['components'];
		console.log("--c_table---->",c_table)

		var f_name = "discount_amount";
		frm.doc.components.forEach(row=>{
		//  if(index.includes(row.idx) ){
			if(row.allow_discount){
				var result = c_table.grid.grid_rows[row.idx-1].docfields.find(f => f.fieldname === f_name);
				result.read_only = 1 ; 
				console.log("--row---->",row.idx)
			}
			console.log("2--row---->",row.idx)

		})

		cur_frm.refresh_fields();
	},

});


frappe.ui.form.on('Program Enrollment Course', {
	courses_add: function(frm){
		frm.fields_dict['courses'].grid.get_field('course').get_query = function(doc) {
			var course_list = [];
			if(!doc.__islocal) course_list.push(doc.name);
			$.each(doc.courses, function(_idx, val) {
				if (val.course) course_list.push(val.course);
			});
			return { filters: [['Course', 'name', 'not in', course_list],
				['Course', 'name', 'in', frm.program_courses.map((e) => e.course)]] };
		};
	}
});

frappe.ui.form.on('Fee Component Enrollment', {
	
    discount_percentage: function(frm, cdt, cdn) {
        var u = locals[cdt][cdn];
        frappe.model.set_value(u.doctype, u.name,"discount_amount", (u.discount_percentage * u.amount)/100);
		frappe.model.set_value(u.doctype, u.name,"grand_total", u.amount - u.discount_amount )
		frm.trigger("calculate_total_amount");
		frm.refresh_fields();
		

     },
	 discount_amount: function(frm, cdt, cdn) {
        var u = locals[cdt][cdn];
        frappe.model.set_value(u.doctype, u.name, "discount_percentage", (u.discount_amount / u.amount)*100.0);
		frappe.model.set_value(u.doctype, u.name,"grand_total", u.amount - u.discount_amount )
		frm.trigger("calculate_total_amount");
		frm.refresh_fields();
     },
	
})