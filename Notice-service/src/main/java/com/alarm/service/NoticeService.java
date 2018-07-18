package com.alarm.service;

import java.util.List;
import java.util.Optional;

import com.alarm.domain.Notice;

public interface NoticeService {

	Optional<List<Notice>> findAllNotice();
	Optional<List<Notice>> findAllNoticeByReceiverId(String receiver_id);
    Optional<List<Notice>> findLatestNoticeByReceiverId(String receiver_id);	
    Optional<List<Notice>> findPreviousNoticeByReceiverId(String receiver_id, int id);
	Boolean saveNotice(Notice notice);
	
}
