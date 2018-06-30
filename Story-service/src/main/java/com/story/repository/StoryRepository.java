package com.story.repository;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.story.domain.Story;

public interface StoryRepository extends CrudRepository<Story, String> {



	@Query("SELECT s FROM Story s ORDER BY s.story_id DESC")
	List<Story> findAllStory(Pageable pageable);

	
	@Query("SELECT s FROM Story s WHERE s.ID=:ID ORDER BY s.story_id DESC")
	List<Story> findStoryByUserIDs(@Param("ID") String ID,Pageable pageable);
	
	@Modifying
	@Transactional
	@Query("DELETE FROM Story e WHERE e.ID=:ID")
	void deleteStoryByUserId(@Param("ID") String ID);
	
	@Query("SELECT s FROM Story s WHERE s.ID=:ID")
	List<Story>findStoryById(@Param("ID") String ID);
	

	
}
