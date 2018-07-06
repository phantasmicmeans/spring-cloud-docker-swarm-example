package com.story.service;

import java.util.List;
import java.util.Optional;

import com.story.domain.Story;

public interface StoryService {

	Optional<List<Story>> findAllStory();
	Optional<List<Story>> findStoryById(String ID);
	Boolean saveStory(Story story);
	Boolean deleteStory(String ID);
	
}
