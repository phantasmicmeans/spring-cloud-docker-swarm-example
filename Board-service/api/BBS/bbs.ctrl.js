const models = require('../../models');

//GET bbs 
//GET bbs/recent/
const latest = (req,res) => {

    //최근 입력된 것들중 10개
    models.board.findAll({

        limit: 10,
        order: [['article_id', 'DESC']],

    }).then(result => {

        if(!result) return status(404).end();
        res.json(result);

    }).catch(err => {

        console.log(err);

    });
}

//GET bbs/last/:article_id
const previous = (req,res) => {
//지금 article_id기준으로 이전 10개
    const article_Id =parseInt(req.params.article_id);

    if(!article_Id)
    {
        return res.status(404).end();
    }

    console.log("Input_article_Id : ", article_Id);

    if(Number.isNaN(article_Id))
    {
        //article_id에 숫자가 안들어온경우
        return res.status(400).end();
    }

    //article_id로숫자가 정확히 들어온경우
    models.board.findAll({

        where: {
            article_id: {$lt: article_Id}
            //Board.article_id < article_Id
        },
        limit:10,
        order: [['article_id','DESC']],

    }).then(result => {

        if(!result) return status(404).end();
        res.json(result);

    }).catch(err => {

        console.log(err);
    })



}

//GET bbs/:id(userid)
const show = (req,res) => {

    //id가 숫자인경우-> article_id 탐색

    const id = req.params.article_id;
    const article_id = parseInt(req.params.article_id,10);
    

    console.log("article_id : ", article_id);

    //:id가 숫자가 아 닌경우  
    if (Number.isNaN(article_id)) 
    {
        models.board.findAll(
        {
            where: { id }

        }).then( result => {

            if (!result) return status(404).end(); //result가 없으면 404
            res.json(result);

        }).catch(err=>{

            console.log(err);

        });

    }
    else{ 
    //:id가 숫자인 경우 
        models.board.findOne(
        {
            where: { article_id }

        }).then(result => {

            if(!result) return status(404).end();
            res.json(result);

        }).catch(err => {

            console.log(err);

        });
    }


}

//db insert
const create = (req, res) => {

    var result= {};
    const input_id = req.body.id;
    const input_title = req.body.title;
    const input_content = req.body.content;
    
    if(!input_id || !input_title || !input_content )
    {
       
        result["success"] = 0;
        result["error"]="Invalid Data";
        res.json(result);
        return res.status(400).end();

    }

    const article = {
        
        id: input_id,
        title: input_title,
        content: input_content
    }
    
    console.log(article);
    
    models.board.create(article)
        .then(result => {

            res.json(article);
            res.status(200).end();

        }) //성공
        .catch(err => {

            if (err){
                console.log(err);
                return res.status(400).end();
            }

        res.status(500).end();
        })
        
}

//article_id로 삭제
const destroy = (req,res) => {

    const article_id = parseInt(req.params.article_id, 10);

    if(Number.isNaN(article_id))
    {
        return res.status(400).end();
    }
    
    console.log("article_id :", article_id);

    models.board.destroy(
    {
        where: { article_id }

    }).then( () => {
        
        res.status(204).end();

    }).catch(err => {

        console.log(err);
    });

}

//좋아요 update
const update = (req,res) => {

    const article_id = parseInt(req.params.article_id, 10);

    if(Number.isNaN(article_id)){
        return res.status(400).end();
    }

    models.board.findOne(
    {
        where: { article_id }

    }).then(result => {
        
        result.likeit = result.likeit+1;
        result.save()
            .then(_ => {
                res.json(result);
            })
            .catch(err => {
                if (err.name === 'SequelizeUniqueConstraintError')
                {
                    return res.status(409).end();
                }
                res.status(500).end();
            })
    })
}


const health = (req, res) => {

    console.log("Health check !!!!!!!!!!");
    res.json({"status" : "UP"});

}



module.exports = {latest, previous, show, create, destroy, update, health};
