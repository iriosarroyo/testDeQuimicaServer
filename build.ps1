param ($msg, $version="minor")
$projects = @('quimica', 'biologia', 'fisica')

git add --all
git commit -m $msg
npm version $version
npm.cmd run build

git push origin
foreach($proj in $projects){
    git push $proj
}