package com.story.domain;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;

@Entity
public class Story {

	@Id
	@GeneratedValue(strategy=GenerationType.AUTO)
	private int story_id;
	private String ID;
	private String message;
	
	protected Story(){}
	
	public Story(String ID, String message)
	{
		this.ID=ID;
		this.message=message;
	}

	public int getStory_id() {
		return story_id;
	}

	public String getID() {
		return ID;
	}

	public void setID(String iD) {
		ID = iD;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
	
	
	
}
