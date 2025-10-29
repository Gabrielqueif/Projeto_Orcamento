import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button} from "@/components/ui/button"

export default function LoginPage() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-sm bg-cinza-claro pt-28 pb-28">
              <CardHeader>
                <CardTitle className="text-ciano">Faça o login na sua conta</CardTitle>
                <CardDescription>
                  Entre com seu email e sua senha
                </CardDescription>                
              </CardHeader>
              <CardContent className="">
                <div className="grid grid-cols-2 items-center">
                  <Label className="ml-2 text-ciano">e-mail</Label>
                  <Label className="justify-end mr-2 text-ciano"><a href="#">Esqueceu seu e-mail?</a></Label>
                </div>
                  <Input className="w=full mt-1 bg-white" placeholder="e-mail"/>
                <div className="grid grid-cols-2 items-center mt-6">
                  <Label className="ml-2 text-ciano">Sua senha</Label>
                  <Label className="justify-end mr-2 text-ciano"><a href="#">Esqueceu sua senha?</a></Label>
                </div>
                  <Input className="w=full mt-1 bg-white" placeholder="Sua senha"/>
              </CardContent>
              <CardFooter>
                <div className="flex flex-col w-full">
                  <Button variant={"default"} className="w-full bg-ciano">Fazer Login</Button>

                  <Button variant={"secondary"} className="w-full mt-2 text-white bg-transparent shadow-md">Fazer Login com google <h2>G</h2></Button>
                  <div>
                    <Label className="justify-center mt-2">Não tem login? <a href="" className="text-blue-400">Cadastre-se</a></Label>
                  </div>
                  </div>
                
              </CardFooter>
            </Card>
        </div>
    )
}