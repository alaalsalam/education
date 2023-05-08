# Copyright (c) 2015, Frappe and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.model.document import Document

from education.students_affairs.doctype.student_group.student_group import \
    get_program_enrollment


class StudentGroupCreationTool(Document):
	def onload(self):
		current_academic_year = frappe.defaults.get_defaults().academic_year
		self.academic_year = current_academic_year
    
	@frappe.whitelist()
	def get_room(self):
		group_list = []
		rooms_of_program = frappe.db.sql(
			"""select
					name as student_group_name,
					name as room, 
					seating_capacity,
   					max_strength,
					class_division
				from
					`tabRoom`
        		where program=%s And used ='0' """,
			(self.program),
			as_dict=1,
		)
		return rooms_of_program

	@frappe.whitelist()
	def create_student_groups(self):
		l = len(self.rooms)
		num_of_stu = 0
		for d in self.rooms:
			num_of_stu +=d.number_of_students
		if num_of_stu and num_of_stu < self.number_of_students:
			frappe.throw(_("You Still have <b>"+ str(self.students_out_groups )+"</b> Student out of Group"))	
   
		for d in self.rooms:
			number_of_students = 0
			if not d.student_group_name:
				frappe.throw(_("Student Group Name is mandatory in row {0}").format(d.idx))
			frappe.publish_realtime(
				"student_group_creation_progress",
				{"progress": [d.idx, l]},
				user=frappe.session.user,
			)
			student_group = frappe.new_doc("Student Group")
			student_group.student_group_name  = d.student_group_name
			student_group.program = self.program
			student_group.room = d.room
			student_group.number_of_students = d.number_of_students
			student_group.seating_capacity = d.seating_capacity
			student_group.max_strength = d.max_strength
			student_group.class_division = d.class_division
			student_group.academic_year = self.academic_year
			student_list = get_students(
				self,
				self.academic_year,
				self.program
				# d.student_group_name,
			)
			student_group.updated = 1
			student_group.save()
			for student in student_list:
					number_of_students +=1
					if number_of_students > d.number_of_students:
						break
					else:						
						student_enroll_group = frappe.get_doc("Program Enrollment",student.name)
						student_enroll_group.update({'student_group':d.student_group_name})
						student_enroll_group.save()
						
			

		frappe.msgprint(_("{0} Student Groups created.").format(l))
	
	@frappe.whitelist()
	def get_number_of_student_in_groups(self):
		student_list = get_students(
				self,
				self.academic_year,
				self.program,
				get_all_enroll= 1,
			)
		return student_list


@frappe.whitelist()
def get_students(
    self,
	academic_year,
	program=None,
	student_group=None,
	get_all_enroll=None,
):
	academic_term=None
	enrolled_students = get_program_enrollment(
		academic_year, academic_term, program,student_group, get_all_enroll = get_all_enroll
	)
	if enrolled_students:
		student_list = []
		count_in_group = 0
		all_enroll = 0
		for s in enrolled_students:
			if frappe.db.get_value("Student", s.student, "enabled"):
				student_list.append(s)
				all_enroll += 1
				if s.student_group:
					count_in_group += 1	
     
		self.students_out_groups = all_enroll - count_in_group
		self.number_of_students = all_enroll
		return student_list
	else:
		frappe.msgprint(_("No students found at program {0}".format(frappe.bold(program))))
		return []