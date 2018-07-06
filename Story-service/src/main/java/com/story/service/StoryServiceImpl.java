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
	public Optional<List<Story>> findAllStory()
	{
		
		try { 
			return Optional.of(storyRepository.findAllStory(PageRequest.of(0,15))); 
		}
		catch(Exception e){ return null; }		


	}
	
	@Override
	public Optional<List<Story>> findStoryById(String ID)
	{
		
		try {
			return Optional.of(storyRepository.findStoryByUserIDs(ID, PageRequest.of(0, 5)));			
		}
		catch(Exception e){ return null; }
		 
	}
	
	@Override
	public Boolean saveStory(Story story)
	{
		try {
			storyRepository.save(Optional.ofNullable(story).get());
			return true;
			
		}catch(Exception e){ return false; }
		
	}
	
	@Override
	public Boolean deleteStory(String ID)
	{
		try {	
			storyRepository.deleteStoryByUserId(ID);
			return true;
			
		}catch(Exception e){ return false; }
			
	}
	
	
}


















