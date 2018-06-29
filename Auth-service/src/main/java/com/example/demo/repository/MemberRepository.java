package com.example.demo.repository;


import org.springframework.data.repository.CrudRepository;

import com.example.demo.domain.Member_role;

public interface MemberRepository extends CrudRepository<Member_role, String> {

}
