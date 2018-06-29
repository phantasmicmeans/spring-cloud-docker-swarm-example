package com.example.demo.rest;

import java.security.Principal;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import com.example.demo.domain.Member_role;
import com.example.demo.repository.MemberRepository;

@CrossOrigin(origins="*")
@RestController
@RequestMapping("/users")
public class MemberController {
	
		private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
	
		@Autowired
		private MemberRepository repository;
		
		@RequestMapping(value="/current", method=RequestMethod.GET)
		public Principal getUser(Principal principal) {
			return principal;
		}
		
		@RequestMapping(value="/{id}", method=RequestMethod.GET)
		public ResponseEntity<Member_role> getMember(@PathVariable("id") final String id){
			final Member_role fetchedMember = repository.findOne(id);
			if(fetchedMember == null) {
				return new ResponseEntity<Member_role>(HttpStatus.NOT_FOUND);
			}
			return new ResponseEntity<Member_role>(fetchedMember, HttpStatus.OK);
		}
		
		@RequestMapping(value = "/users/{id}", method = RequestMethod.PATCH)
		public ResponseEntity<Member_role> patchMember(@PathVariable("id") final String id, @RequestBody final Member_role member){
			final Member_role fetchedMember = repository.findOne(id);
			
			if(fetchedMember == null) {
				return new ResponseEntity<Member_role>(HttpStatus.NOT_FOUND);
			}
			
			if(member.getName() != null) {
				fetchedMember.setName(member.getName());
			}
			if(member.getPassword() != null) {
				fetchedMember.setPassword(member.getPassword());
			}
			if(member.getEmail() != null) {
				fetchedMember.setEmail(member.getEmail());
			}
			
			repository.save(fetchedMember);
			
			
			return new ResponseEntity<Member_role>(fetchedMember, HttpStatus.OK);
		}
		
		@RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
		public ResponseEntity<Void> deleteMember(@PathVariable("id") final String id){
			boolean deleteResult=false;
			final Member_role fetchedMember = repository.findOne(id);
			if(fetchedMember == null) {
				deleteResult = false;
			}else {
				repository.delete(fetchedMember);
				deleteResult = true;
			}
			
			if(!deleteResult) {
				return new ResponseEntity<Void>(HttpStatus.NOT_FOUND);
			}
			return new ResponseEntity<Void>(HttpStatus.OK);
		}
		
		

			
		@RequestMapping(value="/signup", method = RequestMethod.POST)
		public void createUser(@Valid @RequestBody Member_role user) {
			Member_role existing = repository.findOne(user.getUsername());
			Assert.isNull(existing, "user already exists: " + user.getUsername());
			
			String hash = encoder.encode(user.getPassword());
			user.setPassword(hash);
			
			repository.save(user);
			
			System.out.println("new user has been created");
		}
		

}
