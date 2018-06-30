const express = require('express');
const router = express.Router();
//const ctrl = require('./user.ctrl');
const ctrl = require('./bbs.ctrl');

//router.get('/', ctrl.index);
//router.get('/:id', ctrl.show);
//router.delete('/:id',ctrl.destroy);
//router.post('/',ctrl.create);


router.get('/latest/', ctrl.latest); //최근 10개
router.get('/previous/:article_id', ctrl.previous) //이전 10개
router.get('/health',ctrl.health);
router.get('/user/:article_id', ctrl.show);
router.post('/', ctrl.create);
router.put('/:article_id',ctrl.update);
router.delete('/:article_id', ctrl.destroy);

module.exports = router;
