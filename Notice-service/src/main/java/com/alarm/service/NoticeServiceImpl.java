package com.alarm.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.alarm.domain.Notice;
import com.alarm.repository.NoticeRepository;

@Service("noticeService")
public class NoticeServiceImpl implements NoticeService{
	

	@Autowired
	private NoticeRepository noticeRepository;
	
	@Override
	public Optional<List<Notice>> findAllNotice()
	{
		List<Notice>retList= new ArrayList<>();
		Iterable<Notice> maybeNoticeIter = noticeRepository.findAll();
		maybeNoticeIter.iterator().forEachRemaining((element) -> retList.add(element));
		
		return Optional.of(retList);
	
	}
	
	@Override
	public Optional<List<Notice>> findAllNoticeByReceiverId(String receiver_id)
	{
		return Optional.ofNullable(noticeRepository.findNoticeByReceiverId(receiver_id));			
	}

	@Override
    public Optional<List<Notice>> findLatestNoticeByReceiverId(String receiver_id)
    {
		return Optional.ofNullable(noticeRepository.findLatestNoticeByReceiverId(receiver_id, PageRequest.of(0, 10)));			
	}
	
	@Override
	public Optional<List<Notice>> findPreviousNoticeByReceiverId(String receiver_id, int id)
	{
		return Optional.ofNullable(noticeRepository.findLatestNoticeByReceiverId(receiver_id, PageRequest.of(0, 10)));			
	}
	
    @Override
	public Boolean saveNotice(Notice notice)
	{
    	try {
    		noticeRepository.save( Optional.of(notice).get());
    		return true;
    		
    	}catch(Exception e)
    	{
    		return false;
    	}
    	
	}
	
}




















