package com.story.service;

import java.util.List;

import com.story.domain.Story;

public interface StoryService {

	List<Story> findAllStory();
	List<Story> findStoryById(String ID);
	Boolean saveStory(Story story);
	Boolean deleteStory(String ID);
	
	
}
