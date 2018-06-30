package com.story.service;


import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.google.common.collect.Lists;
import com.story.domain.Story;
import com.story.repository.StoryRepository;


@Service("storyService")
public class StoryServiceImpl implements StoryService {

	
	private Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Autowired
	private StoryRepository storyRepository;
	
	@Override
	public List<Story> findAllStory()
	{
		
		Optional<List<Story>> maybeStoryIter = Optional.ofNullable(storyRepository.findAllStory(PageRequest.of(0,15)));

		
		return maybeStoryIter.get();

	}
	
	@Override
	public List<Story> findStoryById(String ID)
	{
		
		Optional<List<Story>> maybeStory = Optional.ofNullable(storyRepository.findStoryByUserIDs(ID, PageRequest.of(0, 5)));

		return maybeStory.get();
		 
	}
	
	@Override
	public Boolean saveStory(Story story)
	{
		try {
			
			Optional<Story> maybeStory = Optional.of(story);
			
			storyRepository.save(maybeStory.get());
			
			logger.info("saved");
			
			return true;
			
		}catch(Exception e)
		{
			logger.info("Nothing to save");
			
			return false;
		}
	}
	
	@Override
	public Boolean deleteStory(String ID)
	{
		try {
			
			Optional <List<Story>> maybeStory = Optional.of(storyRepository.findStoryById(ID));
			
			storyRepository.deleteStoryByUserId(ID);
			
			logger.info("removed");
			
			return true;
			
		}catch(Exception e)
		{
			logger.info("Nothing to remove");
			
			return false;
			
		}
			
	}
	
	
}


















