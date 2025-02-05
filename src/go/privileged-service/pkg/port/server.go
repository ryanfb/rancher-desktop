/*
Copyright © 2022 SUSE LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package port

import (
	"errors"
	"fmt"
	"io"
	"net"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/svc/debug"
)

const network = "tcp"

// Server is a port server listening for port events over vtunnel
type Server struct {
	host        string
	port        int
	eventLogger debug.Log
	quit        chan interface{}
	listener    net.Listener
	stopped     bool
}

func NewServer(addr string, port int, elog debug.Log) *Server {
	return &Server{
		host:        addr,
		port:        port,
		eventLogger: elog,
		stopped:     true,
	}
}

// Start initiates the port server on a given host:port
// errCh is only used to write the initial error back to the caller
func (s *Server) Start(errCh chan<- error) {
	if !s.stopped {
		return
	}
	s.quit = make(chan interface{})
	l, err := net.ListenTCP(network, &net.TCPAddr{IP: net.ParseIP(s.host), Port: s.port})
	if err != nil {
		errCh <- err
		return
	}
	s.listener = l
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			select {
			case <-s.quit:
				s.eventLogger.Info(uint32(windows.NO_ERROR), "port server stopped")
				return
			default:
				s.eventLogger.Error(uint32(windows.ERROR_EXCEPTION_IN_SERVICE), fmt.Sprintf("port server connection accept error: %v", err))
			}
		} else {
			go s.handleEvent(conn)
		}
	}
}

// Stop shuts down the server gracefully
func (s *Server) Stop() {
	close(s.quit)
	s.listener.Close()
	s.stopped = true
}

func (s *Server) handleEvent(con net.Conn) {
	defer con.Close()
	buf := make([]byte, 2048)
	for {
		n, err := con.Read(buf)
		if err != nil && !errors.Is(err, io.EOF) {
			s.eventLogger.Error(uint32(windows.ERROR_EXCEPTION_IN_SERVICE), fmt.Sprintf("read error: %v", err))
			return
		}
		if n == 0 {
			return
		}
	}
}
