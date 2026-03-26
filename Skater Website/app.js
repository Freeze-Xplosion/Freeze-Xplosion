import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient('DEINE_URL','DEIN_KEY')

let user = localStorage.getItem('user')
const status = document.getElementById('status')
const posts = document.getElementById('posts')
const form = document.getElementById('form')
const notificationsDiv = document.getElementById('notifications')

function update(){ 
    status.innerText = user ? "Eingeloggt als " + user : "Nicht eingeloggt" 
}
update()

window.register = async ()=>{
    const nick = document.getElementById('nick').value.trim()
    const pass = document.getElementById('pass').value.trim()
    if(!nick || !pass){ alert("Nickname und Passwort benötigt"); return }

    const {data} = await supabase.from('users').select('*').eq('name', nick)
    if(data.length){ alert("Name vergeben"); return }

    await supabase.from('users').insert([{name:nick,password:pass,points:0}])
    alert("Registriert! Jetzt einloggen.")
}

window.login = async ()=>{
    const nick = document.getElementById('nick').value.trim()
    const pass = document.getElementById('pass').value.trim()
    if(!nick || !pass){ alert("Nickname und Passwort benötigt"); return }

    const {data} = await supabase.from('users').select('*').eq('name', nick)
    if(!data.length){ alert("Falscher Name"); return }

    if(data[0].password === pass){
        user = nick
        localStorage.setItem('user', nick)
        update()
        load()
    } else {
        alert("Falsches Passwort")
    }
}

window.logout = ()=>{
    user = null
    localStorage.removeItem('user')
    update()
    posts.innerHTML = ''
}

function video(url){
    if(!url) return ''
    const id = url.split("v=")[1]?.split("&")[0]
    if(!id) return ''
    return <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>
}

async function loadNotifications(){
    if(!user) return
    const {data} = await supabase.from('notifications').select('*').eq('user', user)
    notificationsDiv.innerHTML = data.map(n=><p>🔔 ${n.text}</p>).join('')
}

async function load(){
    if(!user) return
    const {data} = await supabase.from('blogs').select('*').order('created_at',{ascending:false})
    posts.innerHTML = ''
    for(const b of data){
        const {data:follow} = await supabase.from('follows').select('*').eq('follower', user).eq('following', b.author)
        let div = document.createElement('div')
        div.className = 'card'
        div.innerHTML = `
            ${video(b.video)}
            <h3>${b.title}</h3>
            <p>${b.content}</p>
            <p>Von: ${b.author}</p>
            <button class="vote">👍 ${b.votes || 0}</button>
            <button class="delete">🗑️</button>
            <button class="${follow.length ? 'unfollow' : 'follow'}">${follow.length ? '❌ Unfollow' : '➕ Folgen'}</button>
        `
        div.querySelector('.follow, .unfollow').onclick = async ()=>{
            if(!user){ alert("Login!"); return }
            if(follow.length){
                await supabase.from('follows').delete().eq('follower', user).eq('following', b.author)
            } else {
                await supabase.from('follows').insert([{follower: user, following: b.author}])
            }
            load()
        }
        div.querySelector('.vote').onclick = async ()=>{
            if(!user){ alert("Login!"); return }
            let voters = b.voters || []
            if(voters.includes(user)){ alert("Schon gevotet"); return }
            voters.push(user)
            await supabase.from('blogs').update({votes:(b.votes || 0)+1, voters}).eq('id', b.id)
            load()
        }
        div.querySelector('.delete').onclick = async ()=>{
            if(user !== b.author){ alert("Nur dein Post"); return }
            await supabase.from('blogs').delete().eq('id', b.id)
            load()
        }
        posts.appendChild(div)
    }
    loadNotifications()
}

form.onsubmit = async e=>{
    e.preventDefault()
    if(!user){ alert("Login!"); return }

    await supabase.from('blogs').inser
}