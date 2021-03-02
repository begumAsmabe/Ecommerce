var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectID
const { response } = require('../app')
const { PRODUCT_COLLECTION } = require('../config/collections')

module.exports={
    dosignUp:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
            
        })

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{

                    if(status){
                        console.log("login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else{
            console.log('login failed');
        }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quanity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist =userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quanity':1}
                    }
                    
                    ).then(()=>{
                        resolve()
                    })
                }
                else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    
                        $push:{products:proObj}
                    
                }
                ).then((response)=>{
                    resolve()
                })
            }
            }else
            {
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quanity:'$products.quanity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    },
                    
                },
                {
                 $project:{
                     item:1,quanity:1,product:{$arrayElemAt:['$product',0]}
                 }   
                }
            //     {
            //        $lookup:{
            //         from:collection.PRODUCT_COLLECTION,
            //         let:{prodList:'$products'},
            //         pipeline:[

            //             {
            //                 $match:{
            //                     $expr:{
            //                         $in:['$_id','$$prodList']
            //                     }
            //                 }
            //             }
            //         ],
            //         as:'cartItems'

            //     }
            // }
            ]).toArray()
              // console.log(cartItems);
            console.log(cartItems)
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quanity=parseInt(details.quanity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quanity==1)
             db.get().collection(collection.CART_COLLECTION)
             .updateOne({_id:objectId(details.cart)},
             {
                 $pull:{products:{item:objectId(details.product)}}
             }
            ).then((response)=>{
                resolve({removeProduct:true})
            })
        
            else
            {
            
            db. get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quanity':details.count}
                    }
                    
                    ).then((response)=>{
                        resolve(true)
                    })
                
                }
        })

},
deleteProduct:(userId,proId)=>{

    return new Promise((resolve,reject)=>{
 db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(userId)},
        {
            $pull:{products:{item:objectId(proId)}}
        }
        
       ).then((response)=>{
           resolve({removeProduct:true})
       })
       
    })
}



}